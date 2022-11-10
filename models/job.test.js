"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    jobTestIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// Testing the creation of new jobs.
describe("create", function () {
    const newJob = {
        companyHandle: "c1",
        title: "Test",
        salary: 12345,
        equity: "0.2",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            companyHandle: "c1",
            title: "Test",
            salary: 12345,
            equity: "0.2",
            id: expect.any(Number),
        });
    });
});

// Testing the findAll function.
describe("findAll", function () {
    test("works without filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: jobTestIds[0],
                title: "testJob1",
                salary: 1234,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: jobTestIds[1],
                title: "testJob2",
                salary: 1,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: jobTestIds[2],
                title: "testJob3",
                salary: 300,
                equity: null,
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    test("works: equity", async function () {
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs).toEqual([
            {
                id: jobTestIds[0],
                title: "testJob1",
                salary: 1234,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: jobTestIds[1],
                title: "testJob2",
                salary: 1,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    test("works: minSalary", async function () {
        let jobs = await Job.findAll({ minSalary: 200 });
        expect(jobs).toEqual([
            {
                id: jobTestIds[0],
                title: "testJob1",
                salary: 1234,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
            {
                id: jobTestIds[2],
                title: "testJob3",
                salary: 300,
                equity: null,
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    test("works: equity and minSalary", async function () {
        let jobs = await Job.findAll({ hasEquity: true, minSalary: 200 });
        expect(jobs).toEqual([
            {
                id: jobTestIds[0],
                title: "testJob1",
                salary: 1234,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });

    test("works: name", async function () {
        let jobs = await Job.findAll({ title: "b1" });
        expect(jobs).toEqual([
            {
                id: jobTestIds[0],
                title: "testJob1",
                salary: 1234,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
            },
        ]);
    });
});

// Test the get function.
describe("get", function () {
    test("works", async function () {
        let job = await Job.get(jobTestIds[0]);
        expect(job).toEqual({
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
        });
    });

    test("job not found", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

// Test the update function.
describe("update", function () {
    let updateData = {
        title: "Updated",
        salary: 420,
        equity: "0.6",
    };

    test("works", async function () {
        let job = await Job.update(jobTestIds[0], updateData);
        expect(job).toEqual({
            id: jobTestIds[0],
            companyHandle: "c1",
            ...updateData,
        });
    });

    test("job not found", async function () {
        try {
            await Job.update(0, {
                title: "failTest",
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("no data given", async function () {
        try {
            await Job.update(jobTestIds[0], {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

// Test remove function.
describe("remove", function () {
    test("works", async function () {
        await Job.remove(jobTestIds[0]);
        const res = await db.query(
            `SELECT id FROM jobs WHERE id=$1`,
            [jobTestIds[0]]
        );
        expect(res.rows.length).toEqual(0);
    });

    test("job not found", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});