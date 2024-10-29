import React, { useState } from 'react';
import axios from 'axios';
import * as Yup from 'yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ResetPassword() {
    // Validation schema
    const resetSchema = Yup.object().shape({
        userId: Yup.string().required('User ID is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
    });

    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [resetError, setResetError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Handle form submission
    const handleReset = async () => {
        try {
            // Display toast notification
            toast.info("Sending reset link...", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "light",
            });

            // Validate input
            await resetSchema.validate({ userId, email });

            // Send reset request
            const response = await axios.post(
                `${import.meta.env.VITE_REACT_APP_BASE_URL}/reset-password`,
                { userId, email }
            );

            if (response.status === 200) {
                setSuccessMessage("Reset link sent to your email.");
                setResetError("");
            }
        } catch (error) {
            setResetError("Error: Unable to send reset link.");
        }
    };

    return (
        <div className="no-scrollbar">
            <ToastContainer />
            <div className="flex flex-col h-screen justify-center items-center">
                <div className="flex mt-10 mb-5">
                    <img src="logo.png" alt="Logo" className="w-[300px] pl-1" />
                </div>
                {/* Reset Password */}
                <div className="p-2">
                    <input
                        type="text"
                        placeholder="User ID"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="flex flex-col w-[252px] h-[30.54px] items-start justify-center gap-[10px] px-[26px] py-[18px] relative bg-white rounded-[30px] border border-solid border-[#01b6ee4c] focus:outline-none active:border-[#01b6ee] focus:border-[#01b6ee]"
                    />
                </div>

                <div className="p-2">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex flex-col w-[252px] h-[30.54px] items-start justify-center gap-[10px] px-[26px] py-[18px] relative bg-white rounded-[30px] border border-solid border-[#01b6ee4c] focus:outline-none active:border-[#01b6ee] focus:border-[#01b6ee]"
                    />
                </div>

                {resetError && <span className="text-xs bold text-red-500">{resetError}</span>}
                {successMessage && <span className="text-xs bold text-green-500">{successMessage}</span>}

                <div className="p-2">
                    <button
                        onClick={handleReset}
                        className="flex flex-col w-[252px] h-[30.27px] items-center justify-center gap-[10px] px-[26px] py-[18px] relative bg-[#01b6ee] rounded-[30px]"
                    >
                        <div className="relative w-[39px] h-[21px] mt-[-6.87px] mb-[-6.87px] flex items-center justify-center">
                            <div className="font-normal text-white text-[14px] tracking-[0] leading-[normal]">
                                Submit
                            </div>
                        </div>
                    </button>
                </div>

                <img src="background.jpg" alt="Background" className="absolute -z-10 bg-cover" />
            </div>
        </div>
    );
}

export default ResetPassword;
