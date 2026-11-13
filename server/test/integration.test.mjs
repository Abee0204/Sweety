import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/src/generated/prisma/client.js";
import app from "../dist/src/app.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be configured to run integration tests");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const fixtureTag = randomUUID();
const fixtureEmails = [
  `sweety-integration-a-${fixtureTag}@example.com`,
  `sweety-integration-b-${fixtureTag}@example.com`,
  `sweety-integration-c-${fixtureTag}@example.com`,
];
const password = "Integration-test-password-908!";
const users = {};
const createdUserIds = new Set();
let server;
let baseUrl;
let fixtureEmailsVerifiedAbsent = false;

const request = async (path, { method = "GET", token, body } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
};

const register = (email, name) =>
  request("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
  });

const createReading = (token, reading, extra = {}) =>
  request("/api/readings", {
    method: "POST",
    token,
    body: { ...reading, ...extra },
  });

const json = (response) => response.json();

const utcDay = (date, hour) => {
  const timestamp = new Date(date);
  timestamp.setUTCHours(hour, 0, 0, 0);
  return timestamp.toISOString();
};

const offsetUtcDay = (date, offset) => {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + offset);
  return shifted;
};

const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const reportDay = new Date(today);
if (today.getUTCDate() >= 3) {
  reportDay.setUTCDate(reportDay.getUTCDate() - 1);
} else {
  reportDay.setUTCDate(0);
}
const priorReportDay = new Date(reportDay);
priorReportDay.setUTCDate(priorReportDay.getUTCDate() - 1);
const reportDate = reportDay.toISOString().slice(0, 10);
const priorReportDate = priorReportDay.toISOString().slice(0, 10);
const reportMonth = reportDate.slice(0, 7);
const emptyDate = new Date(today);
const emptyMonthDate = new Date(`${reportMonth}-01T00:00:00.000Z`);
emptyMonthDate.setUTCMonth(emptyMonthDate.getUTCMonth() - 2);
const emptyMonth = emptyMonthDate.toISOString().slice(0, 7);
const monthBoundaryDate = new Date(`${reportMonth}-01T00:00:00.000Z`);
monthBoundaryDate.setUTCDate(0);
const monthBoundaryString = monthBoundaryDate.toISOString().slice(0, 10);

before(async () => {
  await prisma.$queryRaw`SELECT 1`;

  const existingFixtures = await prisma.user.findMany({
    where: { email: { in: fixtureEmails } },
    select: { id: true },
  });
  assert.equal(existingFixtures.length, 0, "fixture email collision detected");
  fixtureEmailsVerifiedAbsent = true;

  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  try {
    const ownedUserIds = new Set(createdUserIds);
    if (fixtureEmailsVerifiedAbsent) {
      const fixtureUsers = await prisma.user.findMany({
        where: { email: { in: fixtureEmails } },
        select: { id: true },
      });
      for (const { id } of fixtureUsers) ownedUserIds.add(id);
    }

    if (ownedUserIds.size > 0) {
      const userIds = Array.from(ownedUserIds);
      await prisma.glucoseReading.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  } finally {
    if (server?.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await prisma.$disconnect();
  }
});

test("Sweety backend PostgreSQL integration", async (t) => {
  let primaryToken;
  let secondaryToken;
  let concurrentToken;

  await t.test("registration validates input, hashes passwords, and rejects duplicates", async () => {
    const response = await register(fixtureEmails[0], "Integration User A");
    assert.equal(response.status, 201);
    const payload = await json(response);
    users.primary = payload.data;
    createdUserIds.add(users.primary.id);
    assert.ok(users.primary.id);
    assert.equal("password" in payload.data, false);

    const storedUser = await prisma.user.findUnique({
      where: { id: users.primary.id },
      select: { password: true },
    });
    assert.ok(storedUser);
    assert.notEqual(storedUser.password, password);
    assert.equal(await bcrypt.compare(password, storedUser.password), true);

    const duplicate = await register(fixtureEmails[0], "Integration User A");
    assert.equal(duplicate.status, 409);

    const invalid = await request("/api/auth/register", {
      method: "POST",
      body: { name: "A", email: "invalid-email", password: "short" },
    });
    assert.equal(invalid.status, 400);

    const secondary = await register(fixtureEmails[1], "Integration User B");
    assert.equal(secondary.status, 201);
    users.secondary = (await json(secondary)).data;
    createdUserIds.add(users.secondary.id);

    const concurrent = await register(fixtureEmails[2], "Integration User C");
    assert.equal(concurrent.status, 201);
    users.concurrent = (await json(concurrent)).data;
    createdUserIds.add(users.concurrent.id);
  });

  await t.test("login validates credentials and issues usable JWTs", async () => {
    const success = await request("/api/auth/login", {
      method: "POST",
      body: { email: fixtureEmails[0], password },
    });
    assert.equal(success.status, 200);
    const payload = await json(success);
    primaryToken = payload.data.token;
    assert.ok(primaryToken);
    assert.deepEqual(payload.data.user, {
      id: users.primary.id,
      name: users.primary.name,
      email: fixtureEmails[0],
    });
    assert.equal("password" in payload.data.user, false);

    const wrongPassword = await request("/api/auth/login", {
      method: "POST",
      body: { email: fixtureEmails[0], password: "Wrong-password-908!" },
    });
    assert.equal(wrongPassword.status, 401);

    const unknownEmail = await request("/api/auth/login", {
      method: "POST",
      body: { email: `unknown-${fixtureTag}@example.com`, password },
    });
    assert.equal(unknownEmail.status, 401);

    const invalid = await request("/api/auth/login", {
      method: "POST",
      body: { email: "invalid-email", password: "" },
    });
    assert.equal(invalid.status, 400);

    const secondaryLogin = await request("/api/auth/login", {
      method: "POST",
      body: { email: fixtureEmails[1], password },
    });
    assert.equal(secondaryLogin.status, 200);
    secondaryToken = (await json(secondaryLogin)).data.token;

    const concurrentLogin = await request("/api/auth/login", {
      method: "POST",
      body: { email: fixtureEmails[2], password },
    });
    assert.equal(concurrentLogin.status, 200);
    concurrentToken = (await json(concurrentLogin)).data.token;
  });

  await t.test("authentication protects current-user API without exposing hashes", async () => {
    const valid = await request("/api/auth/me", { token: primaryToken });
    assert.equal(valid.status, 200);
    const payload = await json(valid);
    assert.equal(payload.data.id, users.primary.id);
    assert.equal("password" in payload.data, false);

    assert.equal((await request("/api/auth/me")).status, 401);
    assert.equal(
      (await request("/api/auth/me", { token: "invalid.jwt.token" })).status,
      401,
    );
    const expiredToken = jwt.sign(
      { id: users.primary.id, email: fixtureEmails[0] },
      process.env.JWT_SECRET,
      { expiresIn: -1 },
    );
    assert.equal((await request("/api/auth/me", { token: expiredToken })).status, 401);
  });

  await t.test("reading creation rejects invalid and unauthenticated requests", async () => {
    const validBody = {
      value: 100,
      unit: "MG_DL",
      readingType: "Fasting",
      recordedAt: utcDay(reportDay, 8),
    };
    assert.equal((await createReading(undefined, validBody)).status, 401);

    for (const body of [
      { ...validBody, value: 0 },
      { ...validBody, value: -1 },
      { ...validBody, value: null },
      { ...validBody, value: "100" },
      { ...validBody, unit: "INVALID_UNIT" },
      { ...validBody, readingType: "INVALID_TYPE" },
      { ...validBody, recordedAt: "not-a-date" },
      { ...validBody, recordedAt: new Date(Date.now() + 60_000).toISOString() },
    ]) {
      assert.equal((await createReading(primaryToken, body)).status, 400);
    }
  });

  let primaryReadingIds = [];
  let secondaryReadingIds = [];

  await t.test("daily limit is enforced independently per user and reads persist", async () => {
    const primaryReadings = [
      { value: 90, unit: "MG_DL", readingType: "Fasting", recordedAt: utcDay(reportDay, 8) },
      { value: 110, unit: "MG_DL", readingType: "BeforeMeal", recordedAt: utcDay(reportDay, 12) },
      { value: 130, unit: "MG_DL", readingType: "AfterMeal", recordedAt: utcDay(reportDay, 18) },
      { value: 5.5, unit: "MMOL_L", readingType: "Dinner", recordedAt: utcDay(reportDay, 20) },
    ];

    for (let index = 0; index < primaryReadings.length; index += 1) {
      const response = await createReading(
        primaryToken,
        primaryReadings[index],
        index === 0 ? { userId: users.secondary.id } : {},
      );
      assert.equal(response.status, 201);
      const payload = await json(response);
      assert.equal(payload.data.userId, users.primary.id);
      primaryReadingIds.push(payload.data.id);
    }

    const persisted = await prisma.glucoseReading.findMany({
      where: { id: { in: primaryReadingIds } },
      select: { id: true, userId: true },
    });
    assert.equal(persisted.length, 4);
    assert.ok(persisted.every(({ userId }) => userId === users.primary.id));

    const duplicateSlot = await createReading(primaryToken, primaryReadings[0]);
    assert.equal(duplicateSlot.status, 409);
    assert.equal(
      (await json(duplicateSlot)).message,
      "A reading for this slot already exists today",
    );

    const secondaryReadings = [
      { value: 70, unit: "MG_DL", readingType: "Fasting", recordedAt: utcDay(reportDay, 7) },
      { value: 80, unit: "MG_DL", readingType: "BeforeMeal", recordedAt: utcDay(reportDay, 9) },
      { value: 90, unit: "MG_DL", readingType: "AfterMeal", recordedAt: utcDay(reportDay, 11) },
      { value: 4.8, unit: "MMOL_L", readingType: "Dinner", recordedAt: utcDay(reportDay, 13) },
    ];
    for (const reading of secondaryReadings) {
      const response = await createReading(secondaryToken, reading);
      assert.equal(response.status, 201);
      secondaryReadingIds.push((await json(response)).data.id);
    }

    const priorDayReadings = [
      { value: 80, unit: "MG_DL", readingType: "Fasting", recordedAt: utcDay(priorReportDay, 8) },
      { value: 4, unit: "MMOL_L", readingType: "BeforeMeal", recordedAt: utcDay(priorReportDay, 12) },
    ];
    for (const reading of priorDayReadings) {
      const response = await createReading(primaryToken, reading);
      assert.equal(response.status, 201);
      primaryReadingIds.push((await json(response)).data.id);
    }

    const monthBoundaryReading = {
      value: 60,
      unit: "MG_DL",
      readingType: "Fasting",
      recordedAt: utcDay(monthBoundaryDate, 23),
    };
    const boundaryResponse = await createReading(primaryToken, monthBoundaryReading);
    assert.equal(boundaryResponse.status, 201);
    primaryReadingIds.push((await json(boundaryResponse)).data.id);
  });

  await t.test("reading slots are unique per user and UTC calendar day", async () => {
    const slotDay = offsetUtcDay(priorReportDay, -3);
    const fasting = {
      value: 95,
      unit: "MG_DL",
      readingType: "Fasting",
      recordedAt: utcDay(slotDay, 8),
    };
    assert.equal((await createReading(concurrentToken, fasting)).status, 201);

    const differentType = {
      ...fasting,
      readingType: "BeforeMeal",
      recordedAt: utcDay(slotDay, 12),
    };
    assert.equal((await createReading(concurrentToken, differentType)).status, 201);

    const duplicateWithDifferentTime = {
      ...fasting,
      recordedAt: utcDay(slotDay, 18),
    };
    const duplicate = await createReading(concurrentToken, duplicateWithDifferentTime);
    assert.equal(duplicate.status, 409);
    assert.equal(
      (await json(duplicate)).message,
      "A reading for this slot already exists today",
    );

    const nextUtcDay = {
      ...fasting,
      recordedAt: utcDay(offsetUtcDay(slotDay, 1), 8),
    };
    assert.equal((await createReading(concurrentToken, nextUtcDay)).status, 201);
  });

  await t.test("concurrent duplicate slot submissions allow only one creation", async () => {
    const body = {
      value: 101,
      unit: "MG_DL",
      readingType: "AfterMeal",
      recordedAt: utcDay(offsetUtcDay(priorReportDay, -4), 10),
    };
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => createReading(concurrentToken, body)),
    );

    assert.equal(responses.filter(({ status }) => status === 201).length, 1);
    assert.equal(responses.filter(({ status }) => status === 409).length, 9);
    const conflicts = await Promise.all(
      responses.filter(({ status }) => status === 409).map(json),
    );
    assert.ok(
      conflicts.every(({ message }) => message === "A reading for this slot already exists today"),
    );
  });

  await t.test("concurrent reading requests cannot exceed the daily limit", async () => {
    const readingTypes = ["Fasting", "BeforeMeal", "AfterMeal", "Dinner"];
    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        createReading(concurrentToken, {
          value: 101,
          unit: "MG_DL",
          readingType: readingTypes[index % readingTypes.length],
          recordedAt: utcDay(offsetUtcDay(priorReportDay, -5), 10),
        }),
      ),
    );
    assert.equal(responses.filter(({ status }) => status === 201).length, 4);
    assert.equal(responses.filter(({ status }) => status === 409).length, 6);

    const limited = await createReading(concurrentToken, {
      value: 105,
      unit: "MG_DL",
      readingType: "Fasting",
      recordedAt: utcDay(offsetUtcDay(priorReportDay, -5), 20),
    });
    assert.equal(limited.status, 409);
  });

  await t.test("reading retrieval is ordered, date-inclusive, and user-scoped", async () => {
    const all = await request("/api/readings", { token: primaryToken });
    assert.equal(all.status, 200);
    const allReadings = (await json(all)).data;
    assert.equal(allReadings.length, 7);
    assert.ok(
      allReadings.every((reading, index) =>
        index === 0 || allReadings[index - 1].recordedAt >= reading.recordedAt,
      ),
    );
    assert.ok(allReadings.every(({ userId }) => userId === users.primary.id));
    assert.equal(allReadings.some(({ id }) => secondaryReadingIds.includes(id)), false);

    const inclusive = await request(
      `/api/readings?startDate=${reportDate}&endDate=${reportDate}&userId=${users.secondary.id}`,
      { token: primaryToken },
    );
    assert.equal(inclusive.status, 200);
    assert.equal((await json(inclusive)).data.length, 4);

    const range = await request(
      `/api/readings?startDate=${priorReportDate}&endDate=${reportDate}`,
      { token: primaryToken },
    );
    assert.equal((await json(range)).data.length, 6);
    assert.equal(
      (await request("/api/readings?startDate=2026-02-30", { token: primaryToken })).status,
      400,
    );
    assert.equal(
      (await request(`/api/readings?startDate=${reportDate}&endDate=${priorReportDate}`, { token: primaryToken })).status,
      400,
    );
  });

  await t.test("daily reports aggregate by UTC day and unit, including empty days", async () => {
    const response = await request(`/api/reports/daily?date=${reportDate}`, {
      token: primaryToken,
    });
    assert.equal(response.status, 200);
    const report = (await json(response)).data;
    assert.equal(report.readings.length, 4);
    assert.equal(report.summary.totalReadings, 4);
    assert.deepEqual(report.summary.byUnit.MG_DL, {
      totalReadings: 3,
      average: 110,
      minimum: 90,
      maximum: 130,
    });
    assert.deepEqual(report.summary.byUnit.MMOL_L, {
      totalReadings: 1,
      average: 5.5,
      minimum: 5.5,
      maximum: 5.5,
    });
    assert.ok(
      report.readings.every((reading, index) =>
        index === 0 || report.readings[index - 1].recordedAt <= reading.recordedAt,
      ),
    );

    const empty = await request(`/api/reports/daily?date=${emptyDate.toISOString().slice(0, 10)}`, {
      token: primaryToken,
    });
    assert.equal(empty.status, 200);
    const emptyReport = (await json(empty)).data;
    assert.equal(emptyReport.readings.length, 0);
    assert.equal(emptyReport.summary.totalReadings, 0);
    assert.equal(emptyReport.summary.byUnit.MG_DL.average, null);
    assert.equal(emptyReport.summary.byUnit.MMOL_L.minimum, null);

    assert.equal((await request("/api/reports/daily?date=2026-02-30", { token: primaryToken })).status, 400);
    assert.equal((await request(`/api/reports/daily?date=${reportDate}`)).status, 401);
  });

  await t.test("monthly reports use UTC month boundaries and separate units", async () => {
    const response = await request(`/api/reports/monthly?month=${reportMonth}`, {
      token: primaryToken,
    });
    assert.equal(response.status, 200);
    const report = (await json(response)).data;
    assert.equal(report.summary.totalReadings, 6);
    assert.deepEqual(report.days.map(({ date, totalReadings }) => ({ date, totalReadings })), [
      { date: priorReportDate, totalReadings: 2 },
      { date: reportDate, totalReadings: 4 },
    ]);
    assert.deepEqual(report.summary.byUnit.MG_DL, {
      totalReadings: 4,
      average: 102.5,
      minimum: 80,
      maximum: 130,
    });
    assert.deepEqual(report.summary.byUnit.MMOL_L, {
      totalReadings: 2,
      average: 4.75,
      minimum: 4,
      maximum: 5.5,
    });
    assert.equal(report.days.some(({ date }) => date === reportDate), true);
    assert.equal(report.days.some(({ date }) => date === monthBoundaryString), false);
    assert.equal(report.summary.totalReadings, 6);

    const empty = await request(`/api/reports/monthly?month=${emptyMonth}`, {
      token: primaryToken,
    });
    assert.equal(empty.status, 200);
    const emptyReport = (await json(empty)).data;
    assert.equal(emptyReport.days.length, 0);
    assert.equal(emptyReport.summary.totalReadings, 0);
    assert.equal(emptyReport.summary.byUnit.MG_DL.maximum, null);

    assert.equal((await request("/api/reports/monthly?month=2026-13", { token: primaryToken })).status, 400);
    assert.equal((await request(`/api/reports/monthly?month=${reportMonth}`)).status, 401);
  });
});
