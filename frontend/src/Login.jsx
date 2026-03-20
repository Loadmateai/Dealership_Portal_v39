import React, { useState } from 'react';
import api from './api'; // Import the centralized API helper
import { Link } from 'react-router-dom';

const Login = ({ setToken, notify }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Using 'api' automatically uses the Base URL from api.js
            const res = await api.post('/api/auth/login', { email, password });
            
            setToken(res.data.token);
            if (notify) notify('Login successful!', 'success');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.msg || 'Invalid Credentials';
            if (notify) notify(msg, 'error');
            else alert(msg);
        }
    };

    // ... (Keep your existing styles object exactly as is) ...
    const styles = {
        // Copy your existing styles here from the previous file
        container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
        card: { width: '360px', padding: '32px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' },
        // ... rest of styles
        logoContainer: { textAlign: 'center', marginBottom: '24px' },
        logoText: { margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a' },
        logoAccent: { color: '#3b82f6' },
        logoSub: { color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600', display: 'block', marginTop: '2px' },
        title: { margin: '0 0 6px 0', fontSize: '20px', color: '#334155', fontWeight: '600', textAlign: 'center' },
        subtitle: { margin: '0 0 24px 0', color: '#94a3b8', fontSize: '13px', textAlign: 'center' },
        input: { width: '100%', padding: '10px 12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' },
        button: { width: '100%', padding: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
        link: { textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.logoContainer}>
                    <h1 style={styles.logoText}>
                        <span style={styles.logoAccent}>LOAD</span>MATE
                    </h1>
                    <small style={styles.logoSub}>Dealership Portal</small>
                </div>

                <h2 style={styles.title}>Welcome Back</h2>
                <p style={styles.subtitle}>Sign in to your account</p>
                
                <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    style={styles.input} 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    style={styles.input} 
                />
                
                <button type="submit" style={styles.button}>Login</button>
                
                <p style={styles.link}>
                    Don't have an account? <Link to="/register" style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Register</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;