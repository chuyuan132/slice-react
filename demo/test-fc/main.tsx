import reactDOM from '../../packages/react-dom';


function Test() {
  return (
    <div>
      <span>hello child</span>
    </div>
  );
}

function App() {
  return (
    <Test />
  );
}

reactDOM.createRoot(document.getElementById('root') as Element).render(App as any);


