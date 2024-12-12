const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// POST /industries - Add a new industry
router.post('/', async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    if (!code || !industry) {
      throw new ExpressError("Code and industry name are required", 400);
    }
    const result = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) 
      RETURNING code, industry`,
      [code, industry]
    );
    return res.status(201).json({ industry: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// GET /industries - List all industries with associated company codes
router.get('/', async (req, res, next) => {
  try {
    const industries = await db.query(`
      SELECT i.code, i.industry, array_agg(ci.comp_code) AS company_codes
      FROM industries AS i
      LEFT JOIN companies_industries AS ci ON i.code = ci.ind_code
      GROUP BY i.code, i.industry
    `);
    return res.json({ industries: industries.rows });
  } catch (err) {
    return next(new ExpressError("An error occurred while fetching industries", 500));
  }
});

// POST /industries/[code]/companies/[comp_code] - Associate an industry with a company
router.post('/:code/companies/:comp_code', async (req, res, next) => {
  try {
    const { code, comp_code } = req.params;
    const result = await db.query(
      `INSERT INTO companies_industries (comp_code, ind_code) VALUES ($1, $2) 
      RETURNING comp_code, ind_code`,
      [comp_code, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Either the company or the industry does not exist", 404);
    }
    return res.status(201).json({ association: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;