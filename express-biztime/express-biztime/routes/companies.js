const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


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
  
      return res.json({ 
        company: {
          ...company,
          invoices: invoicesResult.rows.map(invoice => ({
            id: invoice.id,
            amt: invoice.amt,
            paid: invoice.paid,
            add_date: invoice.add_date,
            paid_date: invoice.paid_date
          }))
        }
      });
    } catch (err) {
      return next(new ExpressError("An error occurred while fetching company details", 500));
    }
  });


// Post /companies (adds a company to the DB)
router.post('/', async (req, res, next) => {
    try{
        console.log('req.body:', req.body);
        const {code, name, description} = req.body;
        if (!code || !name) {
            throw new ExpressError("Code and Name are both required", 400);
        }
        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`, 
            [code, name, description || null]
        );
        return res.status(201).json({company: result.rows[0] });

    } catch (err) {
        console.error('Error adding company:', err);
        if (err instanceof ExpressError) {
        return next(err);
        }
        // Handle potential conflicts or other database errors
        if (err.code === '23505') { // PostgreSQL unique_violation error code
        return next(new ExpressError("Company code already exists", 409));
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