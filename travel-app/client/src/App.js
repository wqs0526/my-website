import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

function Login() {
  return <h1 style={{ padding: "40px" }}>Login Page</h1>;
}

function Register() {
  return <h1 style={{ padding: "40px" }}>Register Page</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;