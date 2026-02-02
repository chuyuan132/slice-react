import reactDOM from '../../packages/react-dom';

function Test() {


  return (
    <div>
      <>
        <ul>
          <li key={1}>1</li>
          <li key={2}>2</li>
          <li key={3}>3</li>
        </ul>
      </>
      <div>999</div>
    </div>

  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(<Test /> as any);


