import logo from './logo.svg';
import './App.css';
import ContactForm from "./components/ContactForm";
import ContactList from "./components/ContactList";


function App() {
  return (
    <div style={{ padding: "20px" }}>
        <h1>연락처 관리</h1>
        <ContactForm />
        <hr style={{ margin: "20px 0" }} />
        <h2>연락처 목록</h2>
        <ContactList />
    </div>
  );
}

export default App;
