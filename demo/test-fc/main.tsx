import reactDOM from '../../packages/react-dom';
import { useState } from 'react'

function Test() {
  const [count, setCount] = useState(100);
  const arr = count % 2 === 0 ? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>] : [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>]
  console.log(arr);

  return (
    <ul onClickCapture={() => setCount(count + 1)}>
      {
        arr
      }
    </ul>

  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


