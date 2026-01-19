import reactDOM from '../../packages/react-dom';
import { useState } from 'react';


function Test() {
  const [count] = useState(1);
  return (
    <div>
      <span>{count}</span>
    </div>
  );
}

function App() {
  return (
    <Test />
  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(App as any);


