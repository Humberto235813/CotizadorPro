import { describe, it, expect } from 'vitest';
import { buildQuoteHtml, QuoteRenderData } from './buildQuoteReportHtml';

const sampleData: QuoteRenderData = {
    company: { name: 'Test Corp', address: '123 Main St', phone: '555-1234' },
    quote: { number: 'Q-0001', date: '2026-01-15', subtotal: 1000, tax: 160, total: 1160, vigenciaDias: 30 },
    client: { name: 'Juan Pérez', company: 'Cliente SA', email: 'juan@test.com' },
    items: [
        { description: 'Servicio de consultoría', quantity: 2, price: 500 },
    ],
};

describe('buildQuoteHtml (unified)', () => {
    it('generates valid HTML with DOCTYPE', () => {
        const html = buildQuoteHtml(sampleData);
        expect(html).toMatch(/^<!doctype html>/i);
        expect(html).toContain('</html>');
    });

    it('includes the quote number in the title', () => {
        const html = buildQuoteHtml(sampleData);
        expect(html).toContain('<title>Cotización Q-0001 — Test Corp</title>');
    });

    it('renders company name', () => {
        const html = buildQuoteHtml(sampleData);
        expect(html).toContain('Test Corp');
    });

    it('renders client info', () => {
        const html = buildQuoteHtml(sampleData);
        expect(html).toContain('Juan Pérez');
        expect(html).toContain('Cliente SA');
        expect(html).toContain('juan@test.com');
    });

    it('renders item descriptions', () => {
        const html = buildQuoteHtml(sampleData);
        expect(html).toContain('Servicio de consultoría');
    });

    it('escapes HTML entities in user data to prevent XSS', () => {
        const xssData: QuoteRenderData = {
            ...sampleData,
            client: { name: '<script>alert("xss")</script>', company: 'Test & Co "quoted"' },
        };
        const html = buildQuoteHtml(xssData);
        // User-supplied data must be escaped
        expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(html).toContain('Test &amp; Co &quot;quoted&quot;');
    });

    it('handles missing optional fields gracefully', () => {
        const minimalData: QuoteRenderData = {
            company: { name: 'Co', address: 'Addr', phone: '123' },
            quote: { number: 'Q-0002', date: '2026-02-01', subtotal: 0, tax: 0, total: 0, vigenciaDias: 15 },
            client: {},
            items: [],
        };
        const html = buildQuoteHtml(minimalData);
        expect(html).toContain('Q-0002');
    });

    it('renders notes and conditions when provided', () => {
        const withNotes: QuoteRenderData = {
            ...sampleData,
            notes: 'Nota de prueba',
            conditions: 'Condición de prueba',
        };
        const html = buildQuoteHtml(withNotes);
        expect(html).toContain('Nota de prueba');
        expect(html).toContain('Condición de prueba');
    });

    it('uses custom primary color when provided', () => {
        const withColor: QuoteRenderData = {
            ...sampleData,
            company: { ...sampleData.company, primaryColor: '#FF5500' },
        };
        const html = buildQuoteHtml(withColor);
        expect(html).toContain('#FF5500');
    });

    it('uses default brand color when primaryColor is not provided', () => {
        const html = buildQuoteHtml(sampleData);
        expect(html).toContain('#364FC7');
    });

    it('renders status badge when status is provided', () => {
        const withStatus: QuoteRenderData = {
            ...sampleData,
            quote: { ...sampleData.quote, status: 'sold' },
        };
        const html = buildQuoteHtml(withStatus);
        expect(html).toContain('VENDIDA');
    });

    it('renders discount column when items have discounts', () => {
        const withDiscount: QuoteRenderData = {
            ...sampleData,
            items: [
                { description: 'Item 1', quantity: 1, price: 100, discountType: 'percent', discountValue: 10 },
            ],
        };
        const html = buildQuoteHtml(withDiscount);
        expect(html).toContain('Desc.');
        expect(html).toContain('10%');
    });
});
