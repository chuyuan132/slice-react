import reactDOM from '../../packages/react-dom';
import { useState, useEffect } from 'react';

function Test() {

  const [num, setNum] = useState(1);

  useEffect(() => {
    console.log('father');
  }, []);

  useEffect(() => {
    console.log('num change', num);
    return () => {
      console.log('num change unmount');
    };
  }, [num]);

  return (
    <div onClick={() => setNum(num - 1)}>
      {num > 0 && <Child />}
    </div>

  );
}


function Child() {
  useEffect(() => {
    console.log('children');
    return () => {
      console.log('children unmount');
    };
  }, []);

  return (
    <div>
      child
    </div>

  );
}
reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


