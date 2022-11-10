"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql")

class Job {
    // Creates a company using title, salary, equity, and company_handle. 
    // Returns the data listed in the query as well as the ID.
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

    // Finds all jobs with optional filters for salary, equity, and title.
    // Same search filter function as the Company model.
    static async findAll({ minSalary, hasEquity, title } = {}) {

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

    static async get(id) {
        // Gets the job with a matching ID.
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle as "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]
        );

        const job = jobRes.rows[0];
        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        // Same query from the get function for Company model.
        // Gets company with a matching handle as the Job model found.
        const companyRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`, [job.companyHandle]
        );

        // Links the company instance to the job instance found.
        delete job.companyHandle;
        job.company = companyRes.rows[0];
        return job;
    }

    // Uses the same methodology to update data as the Company model.
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            { companyHandle: "company_handle" }
        );

        const idVarIdx = "$" + (values.length + 1);
        const querySql = `UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${idVarIdx}
                        RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        return job;
    }

    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]
        );

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);
    }
}

module.exports = Job;