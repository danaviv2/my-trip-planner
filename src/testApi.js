import { testAllApiKeys } from './utils/testApiKeys';

// הרץ בדיקה
testAllApiKeys().then(results => {
  console.log('\n✅ בדיקה הסתיימה!');
  console.log('תוצאות:', results);
});
