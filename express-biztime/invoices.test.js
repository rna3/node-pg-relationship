const request = require('supertest');
const app = require('./app');

describe('Invoices API', () => {
  describe('GET /invoices', () => {
    test('should return list of invoices', async () => {
      const response = await request(app).get('/invoices');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('invoices');
      expect(Array.isArray(response.body.invoices)).toBe(true);
    });
  });

  describe('GET /invoices/:id', () => {
    test('should return a specific invoice', async () => {
      const response = await request(app).get('/invoices/1'); // Assuming invoice with id 1 exists
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('invoice');
      expect(response.body.invoice).toHaveProperty('id', 1);
    });

    test('should return 404 for non-existent invoice', async () => {
      const response = await request(app).get('/invoices/9999'); // Assuming 9999 doesn't exist
      expect(response.status).toBe(404);
    });
  });

  describe('POST /invoices', () => {
    test('should add a new invoice', async () => {
      const newInvoice = { comp_code: 'ibm', amt: 500 };
      const response = await request(app).post('/invoices').send(newInvoice);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('invoice');
      expect(response.body.invoice).toHaveProperty('comp_code', 'ibm');
      expect(response.body.invoice).toHaveProperty('amt', 500);
    });
  });
});