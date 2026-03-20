import React, { useState } from 'react';
import api , {BASE_URL } from './api';
import { Link } from 'react-router-dom';

const Register = ({ setToken }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Ensure this URL matches your backend configuration
            const res = await api.post('/api/auth/register', { name, email, password });
            setToken(res.data.token);
        } catch (err) {
            console.error("Registration Error:", err);
            // Show specific error message from backend if available
            alert(err.response?.data?.msg || 'Error registering. Please check console.');
        }
    };

    const styles = {
        container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' },
        card: { width: '400px', padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
        title: { margin: '0 0 10px 0', fontSize: '26px', color: '#1e293b', fontWeight: '700', textAlign: 'center' },
        subtitle: { margin: '0 0 30px 0', color: '#64748b', fontSize: '14px', textAlign: 'center' },
        input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' },
        button: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' },
        link: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <h2 style={styles.title}>Create Account</h2>
                <p style={styles.subtitle}>Join the dealership portal today</p>
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={styles.input} />
                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
                <button type="submit" style={styles.button}>Register</button>
                <p style={styles.link}>Already have an account? <Link to="/login" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Login</Link></p>
            </form>
        </div>
    );
};
export default Register;