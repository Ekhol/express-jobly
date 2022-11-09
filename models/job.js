"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql")

class Job {
    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1,$2,$3,$4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [data.title, data.salary, data.equity, data.companyHandle,]
        );
        let job = result.rows[0]
        return job;
    }

    static async findAll(searchFilters = {}) {
        const { minSalary, hasEquity, title } = searchFilters;
        let jobsRes = `SELECT j.id, j.title, j.salary, j.equity, j.company_handle AS "companyHandle", c.name as "companyName"
                    FROM jobs j
                    LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        let sqlQuery = [];
        let queryVal = [];

        if (minSalary !== undefined) {
            queryVal.push(minSalary);
            sqlQuery.push(`salary >= $${queryVal.length}`);
        }

        if (hasEquity === true) {
            sqlQuery.push(`equity > 0`);
        }

        if (title !== undefined) {
            queryVal.push(`%${title}%`);
            sqlQuery.push(`title ILIKE $${queryVal.length}`);
        }

        if (sqlQuery.length > 0) {
            jobsRes += " WHERE " + sqlQuery.join(" AND ");
        }

        jobsRes += " ORDER BY title";
        const result = await db.query(jobsRes, queryVal);
        return result.rows;
    }
}