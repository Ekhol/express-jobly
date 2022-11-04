"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(searchFilter = {}) {
    // Adding the search filter parameters to the class function.
    const { minEmployees, maxEmployees, name } = searchFilter;
    // This is the query string that we will append to with the query filters.
    let companiesRes =
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies`;
    // Empty arrays that we will append with filter values and SQL statements.
    let sqlQuery = [];
    let queryVal = [];

    // If fed a value for the name filter, appending the query value with the name we're searching
    // and adding a SQL ILIKE statement to the sql array to append to the original statement.
    if (name) {
      queryVal.push(`%${name}%`);
      sqlQuery.push(`name ILIKE $${queryVal.length}`);
    }

    // Throwing error if the minimum employees exceeds maximum.
    if (minEmployees > maxEmployees) {
      throw new BadRequestError("Minimum employees cannot exceed maximum employees");
    }

    // If min/max employees are a valid integer, we're pushing the value for min/max employees to the query value
    // and pushing a SQL statement to the query to append to the original statement.
    if (minEmployees !== undefined) {
      queryVal.push(minEmployees);
      sqlQuery.push(`num_employees >= $${queryVal.length}`);
    }

    if (maxEmployees !== undefined) {
      queryVal.push(maxEmployees);
      sqlQuery.push(`num_employees <= $${queryVal.length}`);
    }

    // Putting the original SQL statement together with the values and queries that we pushed into the 
    // above arrays. 
    if (sqlQuery.length > 0) {
      companiesRes += " WHERE " + sqlQuery.join(" AND ");
    }

    companiesRes += " ORDER BY name";

    // Submitting the completed SQL query to the database.
    const result = await db.query(companiesRes, queryVal);
    return result.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
