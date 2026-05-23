// MagicPay PIX Integration Test
// Tests: authentication, PIX creation, response parsing

const API_KEY = 'hz1P0ETLi5vJ8VY_k3VjGnSXAJ7RAG8aec40RnRCoSk';
const BASE_URL = 'https://api.sistema-magicpay.com/v1';

async function testMagicPay() {
  console.log('🧪 Testing MagicPay PIX Integration\n');
  console.log(`🔑 API Key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
  console.log(`🌐 URL: ${BASE_URL}\n`);

  // Test 1: Create PIX Payment
  console.log('━'.repeat(50));
  console.log('📝 Test 1: Create PIX Payment');
  console.log('━'.repeat(50));

  const externalRef = `test-${Date.now()}`;
  const payload = {
    amount: 2990, // R$ 29,90
    currency: 'BRL',
    method: 'PIX',
    description: 'Teste de integracao Swiftpay',
    externalRef,
    notificationUrl: 'https://webhook.site/test-swiftpay',
    payer: {
      name: 'Cliente Teste',
      taxId: '12345678901',
      email: 'cliente@teste.com',
      phone: '11999999999',
    },
    items: [{ quantity: 1, name: 'Produto Teste', price: 2990, type: 'DIGITAL' }],
  };

  try {
    const response = await fetch(`${BASE_URL}/payment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(`📋 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('\n✅ PIX CREATED SUCCESSFULLY!\n');
      console.log(`  ID:         ${data.id}`);
      console.log(`  Status:     ${data.status}`);
      console.log(`  Amount:     ${data.amount}`);
      console.log(`  ExternalRef: ${data.externalRef}`);
      
      if (data.data) {
        console.log(`\n  📄 PIX Data:`);
        console.log(`  CopyPaste:  ${data.data.copypaste?.slice(0, 60)}...`);
        console.log(`  E2E:        ${data.data.e2e || 'N/A'}`);
      }

      // Test 2: Consult payment status
      console.log('\n' + '━'.repeat(50));
      console.log('📝 Test 2: Consult Payment Status');
      console.log('━'.repeat(50));

      const statusRes = await fetch(`${BASE_URL}/payment/${data.id}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      const statusData = await statusRes.json();
      console.log(`\n  Status:  ${statusRes.status}`);
      console.log(`  Payment: ${statusData.id}`);
      console.log(`  Status:  ${statusData.status}`);
      if (statusData.data) {
        console.log(`  PIX:     ${statusData.data.copypaste ? 'Present ✅' : 'Not present ❌'}`);
      }

      console.log('\n' + '━'.repeat(50));
      console.log('✅ ALL TESTS PASSED');
      console.log('━'.repeat(50));
      console.log(`\n📌 ExternalRef: ${externalRef}`);
      console.log(`   Use this to test the webhook callback.\n`);

    } else {
      console.log('\n❌ CREATE FAILED\n');
      console.log(`  Error: ${data.error || 'Unknown'}`);
      console.log(`  Message: ${data.message || JSON.stringify(data)}`);
      process.exit(1);
    }
  } catch (err) {
    console.log('\n❌ NETWORK ERROR\n');
    console.log(`  ${err.message}`);
    process.exit(1);
  }
}

testMagicPay();
