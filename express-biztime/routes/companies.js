const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require('slugify');


// GET /companies - Returns list of companies
router.get('/', async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT *
         FROM companies`
      );
      return res.json({ companies: result.rows });
    } catch (err) {
      return next(new ExpressError("An error occurred while fetching companies", 500));
    }
  });

// GET /companies/code - Returns data on specific company
router.get('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const companyResult = await db.query(
        `SELECT c.code, c.name, c.description 
         FROM companies AS c 
         WHERE c.code = $1`,
        [code]
      );
  
      if (companyResult.rows.length === 0) {
        return next(new ExpressError(`No company found with code: ${code}`, 404));
      }
  
      const company = companyResult.rows[0];
      const invoicesResult = await db.query(
        `SELECT id, amt, paid, add_date, paid_date 
         FROM invoices 
         WHERE comp_code = $1`,
        [code]
      );
  
      const industriesResult = await db.query(
        `SELECT i.industry 
         FROM industries AS i 
         JOIN companies_industries AS ci ON i.code = ci.ind_code
         WHERE ci.comp_code = $1`,
        [code]
      );
  
      return res.json({ 
        company: {
          ...company,
          invoices: invoicesResult.rows,
          industries: industriesResult.rows.map(ind => ind.industry)
        }
      });
    } catch (err) {
      return next(new ExpressError("An error occurred while fetching company details", 500));
    }
  });


// Post /companies (adds a company to the DB)
router.post('/', async (req, res, next) => {
  try {
    // Extract company details from request body
    const { name, description } = req.body;

    // Check if all required fields are present
    if (!name) {
      throw new ExpressError("Name is a required field.", 400);
    }

    // Generate the code using slugify
    const code = slugify(name, { lower: true, strict: true });

    // Insert the new company into the database
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
       VALUES ($1, $2, $3) 
       RETURNING code, name, description`,
      [code, name, description || null] // description is optional
    );

    // Return the newly created company
    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    // Handle database or input errors
    if (err instanceof ExpressError) {
      return next(err);
    }
    // Handle potential conflicts or other database errors
    if (err.code === '23505') { // PostgreSQL unique_violation error code
      return next(new ExpressError("A company with that name (code) already exists", 409));
    }
    return next(new ExpressError("An error occurred while adding the company", 500));
  }
});

router.put('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const { name, description } = req.body;
  
      // Check if all required fields are present
      if (!name) {
        throw new ExpressError("Name is a required field for updating a company.", 400);
      }
  
      // Update the company in the database
      const result = await db.query(
        `UPDATE companies 
         SET name = $1, description = $2 
         WHERE code = $3 
         RETURNING code, name, description`,
        [name, description || null, code]
      );
  
      if (result.rows.length === 0) {
        throw new ExpressError(`Company not found with code: ${code}`, 404);
      }
  
      return res.json({ company: result.rows[0] });
    } catch (err) {
      return next(err);
    }
  });


// DELETE /companies/:code - Delete company
router.delete('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
  
      // Delete the company from the database
      const result = await db.query(
        `DELETE FROM companies 
         WHERE code = $1 
         RETURNING code`,
        [code]
      );
  
      if (result.rows.length === 0) {
        throw new ExpressError(`Company not found with code: ${code}`, 404);
      }
  
      return res.json({ status: "deleted" });
    } catch (err) {
      return next(err);
    }
  });


  
  module.exports = router;