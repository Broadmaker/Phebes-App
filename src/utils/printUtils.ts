import * as Print from 'expo-print';
import type { Product } from '../db/types';
import { Asset } from 'expo-asset';

let isPrinting = false;

/**
 * Get logo URI (Production Safe – No filesystem, No Base64)
 */
async function getLogoUri(): Promise<string> {
  const asset = Asset.fromModule(require('../../assets/phebes.png'));
  await asset.downloadAsync();

  const uri = asset.localUri ?? asset.uri;

  if (!uri) {
    throw new Error('Logo URI not found');
  }

  return uri;
}

/**
 * Print Sales Report (Fully Production Safe)
 */
export async function printSalesReport(
  products: Product[],
  productStats: Record<number, { unitsSold: number; total: number }>,
  totalSales: number,
  dateFilter: string
): Promise<void> {
  if (isPrinting) {
    console.warn('Print already in progress.');
    return;
  }

  try {
    isPrinting = true;
    console.log('Starting print process...');

    const logoUri = await getLogoUri();

    // Sort best-selling first
    const sortedProducts = [...products].sort(
      (a, b) =>
        (productStats[b.id]?.unitsSold ?? 0) -
        (productStats[a.id]?.unitsSold ?? 0)
    );

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @page { margin: 20mm; }

            body {
              font-family: Arial, sans-serif;
              padding: 10px;
            }

            .header {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
            }

            .logo {
              width: 70px;
              height: 70px;
              border-radius: 50%;
              margin-right: 15px;
            }

            h2 {
              margin: 0;
            }

            .meta {
              font-size: 12px;
              color: #555;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }

            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              font-size: 12px;
            }

            th {
              background-color: #f2f2f2;
            }

            tr.best {
              background-color: #d4edda;
            }

            tfoot td {
              font-weight: bold;
              background-color: #f9f9f9;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <img src="${logoUri}" class="logo" />
            <div>
              <h2>Phebe's POS System</h2>
              <div class="meta">Filter: ${dateFilter}</div>
              <div class="meta">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Units Sold</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sortedProducts
                .map((p, index) => {
                  const stats = productStats[p.id] ?? {
                    unitsSold: 0,
                    total: 0,
                  };

                  const bestClass = index === 0 ? 'best' : '';

                  return `
                    <tr class="${bestClass}">
                      <td>${p.name}</td>
                      <td>₱${p.price.toFixed(2)}</td>
                      <td>${stats.unitsSold}</td>
                      <td>₱${stats.total.toFixed(2)}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>

            <tfoot>
              <tr>
                <td colspan="3">Total Sales</td>
                <td>₱${totalSales.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    // 🔥 Critical for Android Production Stability
    const { uri } = await Print.printToFileAsync({ html });

    await Print.printAsync({ uri });

    console.log('Print dialog opened successfully.');

  } catch (error) {
    console.error('Print failed:', error);
    alert('Printing failed. Please try again.');
  } finally {
    isPrinting = false;
  }
}
