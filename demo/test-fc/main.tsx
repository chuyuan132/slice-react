import reactDOM from '../../packages/react-dom';
import { useState } from 'react';

function Test() {

  const [count, setCount] = useState(0);

  return (
    <div onClick={() => {
      setCount((count) => count + 1);
      setCount((count) => count + 1);
      setCount((count) => count + 1);

    }}>
      {count}
    </div>

  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


