import { useEffect, useState } from 'react';
import { webStorageAdapter } from '../../packages/devtools-floating-menu/src/adapters/storage/web.storage';
import { webDimensionsAdapter } from '../../packages/devtools-floating-menu/src/adapters/dimensions/web.dimensions';

export const TestAdapters = () => {
  const [storageTest, setStorageTest] = useState<string>('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Test storage
    const testStorage = async () => {
      await webStorageAdapter.setItem('test_key', 'Hello from adapters!');
      const value = await webStorageAdapter.getItem('test_key');
      setStorageTest(value || 'null');
    };
    testStorage();

    // Test dimensions
    setDimensions(webDimensionsAdapter.getWindow());

    // Test resize listener
    const unsubscribe = webDimensionsAdapter.onChange((dims) => {
      setDimensions(dims);
    });

    return unsubscribe;
  }, []);

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      background: '#f0f0f0',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <h2 style={{ marginBottom: '1rem' }}>Adapter Tests</h2>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Storage Adapter:</strong>
        <p>Saved and retrieved: "{storageTest}"</p>
      </div>

      <div>
        <strong>Dimensions Adapter:</strong>
        <p>Window size: {dimensions.width} x {dimensions.height}</p>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          (Resize the browser window to test the onChange listener)
        </p>
      </div>
    </div>
  );
};
