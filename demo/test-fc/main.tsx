import reactDOM from '../../packages/react-dom';
import { useState } from 'react'

function Test() {
  const [num, ccc] = useState(1);
  window.abc = ccc;
  return (
    <span>{num}</span>
  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


