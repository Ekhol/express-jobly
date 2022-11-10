"use strict";

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();

//Post route.
//Accepts title, salary, equity, companyHandle and returns those with a generated id.
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

//findAll route.
//Returns jobs with optional search filters:
// minSalary, hasEquity, title.
router.get("/", async function (req, res, next) {
    const que = req.query;

    if (que.minSalary !== undefined) que.minSalary = +que.minSalary;
    que.hasEquity = que.hasEquity === "true";
    try {
        const validator = jsonschema.validate(que, jobSearchSchema);
        if (!validator.valid) {
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }
        const jobs = await Job.findAll(que);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

//Find by id.
router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

//Patch by id.
router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

//Delete by id.
router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: +req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;