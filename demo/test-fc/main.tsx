import reactNoopRender from 'react-noop-renderer';
// import reactDOM from 'react-dom';
function App() {

  return (
    <div>
      <Child />
      <div>hello world</div>
    </div>
  );
}

function Child() {
  return <div>react</div>
}


// @ts-ignore
const root = reactNoopRender.createRoot()
root.render(<App /> as any)
const children = root.getChildren()
console.log('渲染的children', children);



// reactDOM.createRoot(document.getElementById('root')).render(<App />);
