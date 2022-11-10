"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
    jobTestIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

//Post route tests

describe("POST /jobs", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .post(`/jobs`)
            .send({
                companyHandle: "c1",
                title: "newTest",
                salary: 666,
                equity: "0.5",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "newTest",
                salary: 666,
                equity: "0.5",
                companyHandle: "c1",
            },
        });
    });

    test("unauthorized for not admin", async function () {
        const resp = await request(app).post(`/jobs`)
            .send({
                companyHandle: "c1",
                title: "newTest",
                salary: 666,
                equity: "0.5",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "c1",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "c1",
                title: "newTest",
                salary: "broke-test",
                equity: "0.5",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//Testing get routes.
describe("GET /jobs", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs`);
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "testJob1",
                    salary: 1234,
                    equity: "0.1",
                    companyHandle: "c1",
                    companyName: "C1"
                },
                {
                    id: expect.any(Number),
                    title: "testJob2",
                    salary: 1,
                    equity: "0.2",
                    companyHandle: "c1",
                    companyName: "C1"
                },
                {
                    id: expect.any(Number),
                    title: "testJob3",
                    salary: 300,
                    equity: null,
                    companyHandle: "c1",
                    companyName: "C1"
                },
            ],
        });
    });

    test("filters work", async function () {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ minSalary: 200, title: "ob1" });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "testJob1",
                    salary: 1234,
                    equity: "0.1",
                    companyHandle: "c1",
                    companyName: "C1"
                },
            ],
        });
    });

    test("invalid filter", async function () {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ break: "break" });
        expect(resp.statusCode).toEqual(400);
    });
});

// Get jobs by id.
describe("GET /jobs/:id", function () {
    test("works", async function () {
        const resp = await request(app).get(`/jobs/${jobTestIds[0]}`);
        expect(resp.body).toEqual({
            job:
            {
                id: jobTestIds[0],
                title: "testJob1",
                salary: 1234,
                equity: "0.1",
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1,
                    logoUrl: "http://c1.img",
                },
            },
        });
    });

    test("invalid job id", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

// Patch jobs by id.
describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobTestIds[0]}`)
            .send({
                title: "newName",
            }).set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "newName",
                salary: 1234,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("unauthorized for not admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobTestIds[0]}`)
            .send({
                title: "newName",
            }).set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("job id invalid", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "newName",
            }).set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobTestIds[0]}`)
            .send({
                salary: "we pay in apples",
            }).set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

//Testing Delete function by id.
describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobTestIds[0]}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: jobTestIds[0] });
    });

    test("unathorized for non admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobTestIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauthorized for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobTestIds[0]}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("job id invalid", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    })
});