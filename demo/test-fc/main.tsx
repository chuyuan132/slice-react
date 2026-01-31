import reactDOM from '../../packages/react-dom';
import { useState } from 'react'

function Test() {
  const arr = [1, 2, 3];
  return (
    <div>
      <ul>
        {
          arr.map(item => {
            return <li key={item}>{item}</li>
          })
        }
      </ul>
    </div>

  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


