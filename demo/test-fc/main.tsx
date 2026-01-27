import reactDOM from '../../packages/react-dom';
import { useState } from 'react'
function App() {
  return (
    <Test />
  );
}

function Test() {
  const [num, setState] = useState(1);
  window.setState = setState;
  return (
    <div>
      <span>{num}</span>
    </div>
  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(Test as any);


