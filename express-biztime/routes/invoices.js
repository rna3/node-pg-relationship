const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

// GET /invoices - Returns list of invoices
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM invoices`
    );
    return res.json({ invoices: result.rows });
  } catch (err) {
    return next(new ExpressError('An error occurred while fetching invoices', 500));
  }
});


//GET /invoice/id - return data on specific invoice
router.get('/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const result = await db.query(
            `SELECT * 
            FROM invoices AS i
            JOIN companies AS c ON i.comp_code = c.code
            WHERE id = $1`, 
            [id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no data for id: ${id}`, 404);
        }

        const invoice = result.rows[0];

        return res.json({
            invoice: {
              id: invoice.id,
              amt: invoice.amt,
              paid: invoice.paid,
              add_date: invoice.add_date,
              paid_date: invoice.paid_date,
              company: {
                code: invoice.code,
                name: invoice.name,
                description: invoice.description
              }
            }
          });

    } catch (err) {
        return next(err);
    }
})


// POST /invoices - Adds a new invoice
router.post('/', async (req, res, next) => {
    try {
      // Extract invoice details from request body
      const { comp_code, amt } = req.body;
  
      // Check if all required fields are present
      if (!comp_code || !amt) {
        throw new ExpressError("Company code and amount are required fields.", 400);
      }
  
      // Insert the new invoice into the database
      const result = await db.query(
        `INSERT INTO invoices (comp_code, amt) 
         VALUES ($1, $2) 
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]
      );
  
      // Return the newly created invoice
      return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
      // Handle database or input errors
      if (err.code === '23503') { // Foreign key violation
        return next(new ExpressError(`Company not found with code: ${req.body.comp_code}`, 404));
      } else if (err.code === '23505') { // Unique constraint violation
        return next(new ExpressError("An invoice with this ID already exists", 409));
      }
      return next(new ExpressError("An error occurred while adding the invoice", 500));
    }
  });


// PUT /invoices/:id - Update an existing invoice
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt, paid } = req.body;

    // Check if the amount is provided
    if (amt === undefined) {
      throw new ExpressError("Amount is required for updating an invoice.", 400);
    }

    // Prepare the SQL query based on whether we're paying or un-paying
    let query = `
      UPDATE invoices 
      SET amt = $1, 
          paid = $2`;
    
    let values = [amt, paid];

    // Determine the paid_date based on the 'paid' status
    if (paid === true) {
      query += `, paid_date = CURRENT_DATE::date`;
    } else if (paid === false) {
      query += `, paid_date = NULL`;
    } else {
      // If 'paid' is neither true nor false, keep the existing paid_date
      query += `, paid_date = paid_date`; // This keeps the current value
    }

    query += `
      WHERE id = $3 
      RETURNING id, comp_code, amt, paid, add_date, paid_date`;

    values.push(id); // Add id to the values array

    // Update the invoice in the database
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice not found with id: ${id}`, 404);
    }

    // Return the updated invoice
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    // Handle database or input errors
    return next(err);
  }
});


// DELETE /invoices/:id - Delete an invoice
router.delete('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
  
      // Delete the invoice from the database
      const result = await db.query(
        `DELETE FROM invoices 
         WHERE id = $1 
         RETURNING id`,
        [id]
      );
  
      if (result.rows.length === 0) {
        throw new ExpressError(`Invoice not found with id: ${id}`, 404);
      }
  
      // Return status
      return res.json({ status: "deleted" });
    } catch (err) {
      return next(err);
    }
  });


module.exports = router;