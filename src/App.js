import logo from './logo.svg';
import './App.css';
//import ContactForm from "./components/ContactForm";
//import ContactList from "./components/ContactList";
import DeviceRegister from "./components/DeviceRegister";
import LeaseNoticeList from './components/LeaseNoticeList';

function App() {
  return (
    <div style={{ padding: "20px" }}>
        <DeviceRegister />
        <LeaseNoticeList />
    </div>
  );
}

export default App;
