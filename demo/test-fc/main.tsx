import reactDOM from '../../packages/react-dom';
import { useState } from 'react'

function Test() {
  const [num, ccc] = useState(1);
  return (
    <div>
      <span onClick={() => ccc(num + 1)}>{num}</span>
    </div>

  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


