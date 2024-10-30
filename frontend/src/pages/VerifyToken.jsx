import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as Yup from 'yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '/logo.png';
import Select from 'react-select';
import { Link } from 'react-router-dom';

function VerifyToken() {
    // Validation schema
    const countries = [
        { "value": "Avatar (1).jpg", "label": "Avatar (1)", "image": "/Avatar/Avatar (1).jpg" },
        { "value": "Avatar (2).jpg", "label": "Avatar (2)", "image": "/Avatar/Avatar (2).jpg" },
        { "value": "Avatar (3).jpg", "label": "Avatar (3)", "image": "/Avatar/Avatar (3).jpg" },
        { "value": "Avatar (4).jpg", "label": "Avatar (4)", "image": "/Avatar/Avatar (4).jpg" },
        { "value": "Avatar (5).jpg", "label": "Avatar (5)", "image": "/Avatar/Avatar (5).jpg" },
        { "value": "Avatar (6).jpg", "label": "Avatar (6)", "image": "/Avatar/Avatar (6).jpg" },
        { "value": "Avatar (7).jpg", "label": "Avatar (7)", "image": "/Avatar/Avatar (7).jpg" },
        { "value": "Avatar (8).jpg", "label": "Avatar (8)", "image": "/Avatar/Avatar (8).jpg" },
        { "value": "Avatar (9).jpg", "label": "Avatar (9)", "image": "/Avatar/Avatar (9).jpg" },
        { "value": "Avatar (10).jpg", "label": "Avatar (10)", "image": "/Avatar/Avatar (10).jpg" },
        { "value": "Avatar (11).jpg", "label": "Avatar (11)", "image": "/Avatar/Avatar (11).jpg" },
        { "value": "Avatar (12).jpg", "label": "Avatar (12)", "image": "/Avatar/Avatar (12).jpg" },
        { "value": "Avatar (13).jpg", "label": "Avatar (13)", "image": "/Avatar/Avatar (13).jpg" },
        { "value": "Avatar (14).jpg", "label": "Avatar (14)", "image": "/Avatar/Avatar (14).jpg" },
        { "value": "Avatar (15).jpg", "label": "Avatar (15)", "image": "/Avatar/Avatar (15).jpg" },
        { "value": "Avatar (16).jpg", "label": "Avatar (16)", "image": "/Avatar/Avatar (16).jpg" },
        { "value": "Avatar (17).jpg", "label": "Avatar (17)", "image": "/Avatar/Avatar (17).jpg" },
        { "value": "Avatar (18).jpg", "label": "Avatar (18)", "image": "/Avatar/Avatar (18).jpg" },
        { "value": "Avatar (19).jpg", "label": "Avatar (19)", "image": "/Avatar/Avatar (19).jpg" },
        { "value": "Avatar (20).jpg", "label": "Avatar (20)", "image": "/Avatar/Avatar (20).jpg" },
        { "value": "Avatar (21).jpg", "label": "Avatar (21)", "image": "/Avatar/Avatar (21).jpg" },
        { "value": "Avatar (22).jpg", "label": "Avatar (22)", "image": "/Avatar/Avatar (22).jpg" },
        { "value": "Avatar (23).jpg", "label": "Avatar (23)", "image": "/Avatar/Avatar (23).jpg" },
        { "value": "Avatar (24).jpg", "label": "Avatar (24)", "image": "/Avatar/Avatar (24).jpg" },
        { "value": "Avatar (25).jpg", "label": "Avatar (25)", "image": "/Avatar/Avatar (25).jpg" },
        { "value": "Avatar (26).jpg", "label": "Avatar (26)", "image": "/Avatar/Avatar (26).jpg" },
        { "value": "Avatar (27).jpg", "label": "Avatar (27)", "image": "/Avatar/Avatar (27).jpg" },
        { "value": "Avatar (28).jpg", "label": "Avatar (28)", "image": "/Avatar/Avatar (28).jpg" },
        { "value": "Avatar (29).jpg", "label": "Avatar (29)", "image": "/Avatar/Avatar (29).jpg" },
        { "value": "Avatar (30).jpg", "label": "Avatar (30)", "image": "/Avatar/Avatar (30).jpg" }
    ]

    const formatOptionLabel = ({ value, label, image }) => (
        <div className='flex items-center '>
            <img className='w-8 rounded-full' src={image} alt={label} style={{ marginRight: '10px' }} />
            {label}
        </div>
    );
    const validationSchema = Yup.object({

        password: Yup.string()
            .required('Required Password'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Required'),
        Avatar: Yup.string()
            .required('Required Avatar'),
    });

    const [Avatar, setAvatar] = useState("Avatar (1).jpg");
    const [Password, setPassword] = useState();
    const [CPassword, setCPassword] = useState();
    const [token, settoken] = useState();
    const [resetError, setResetError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    async function verifyToken(token) {
        try {
            const response = await fetch(`${import.meta.env.VITE_REACT_APP_BASE_URL}/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token }) // Send token in the request body
            });

            if (response.status != 200) {
                setResetError(`Link Expired! Status: ${response.status}`);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error verifying token:', error);
        }
    }
    async function formSubmit() {
        try {

            validationSchema.validate({
                password: Password,
                confirmPassword: CPassword,
                Avatar: Avatar
            }, { abortEarly: false })
                .then(async () => {
                    const response = await fetch(`${import.meta.env.VITE_REACT_APP_BASE_URL}/change-password`, {
                        method: 'POST', // Specify the method as POST
                        headers: {
                            'Content-Type': 'application/json' // Specify the content type as JSON
                        },
                        body: JSON.stringify({
                            token: token, // Include the JWT token
                            password: Password, // New password to be set
                            newProfilePicture: Avatar // New profile picture URL
                        })
                    });
                    if (response.status == 200) {
                        setSuccessMessage("Password Reset Successfull")
                    }
                    // Handle the response
                    if (!response.ok) {
                        // If the response status is not ok, throw an error
                        const errorData = await response.json();
                        setResetError('An error occurred')
                        throw new Error(errorData.error || 'An error occurred');
                    }
                    // If successful, parse the response
                    const data = await response.text(); //
                }).catch((error) => {
                    // Handle validation errors here
                    if (error instanceof Yup.ValidationError) {
                        // Handle validation error
                        toast('Validation error: ' + error.errors)
                        console.error('Validation error:', error.errors);
                    } else {
                        // Handle other errors (e.g., network errors)
                        console.error('Error:', error.message);
                    }
                })
        }
        catch (error) {
            setResetError('An error occurred')

        }
    }
    useEffect(() => {
        const url = new URL(window.location.href); // Get the full URL
        const token = url.searchParams.get('token'); // Extract the token from query parameters
        verifyToken(token)
        settoken(token)
    }, []);

    return (
        <div className="no-scrollbar">
            <ToastContainer />
            <div className="flex flex-col h-screen justify-center items-center">
                <div className="flex mt-10 mb-5">
                    <img src={logo} alt="Logo" className="w-[300px] pl-1" />
                </div>
                Reset Password
                <div className="p-2">
                    <input
                        type="password"
                        placeholder="New Password"
                        value={Password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex flex-col w-[252px] h-[30.54px] items-start justify-center gap-[10px] px-[26px] py-[18px] relative bg-white rounded-[30px] border border-solid border-[#01b6ee4c] focus:outline-none active:border-[#01b6ee] focus:border-[#01b6ee]"
                    />
                </div>

                <div className="p-2">
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={CPassword}
                        onChange={(e) => setCPassword(e.target.value)}
                        className="flex flex-col w-[252px] h-[30.54px] items-start justify-center gap-[10px] px-[26px] py-[18px] relative bg-white rounded-[30px] border border-solid border-[#01b6ee4c] focus:outline-none active:border-[#01b6ee] focus:border-[#01b6ee]"
                    />
                </div>
                <Select
                    className="basic-multi-select w-[252px] rounded-full z-10 border-1  border-gray-300 my-2 focus:border-gray-300 focus:outline-none focus:ring-0 focus:ring-gray-400 focus:ring-offset-0"
                    options={countries}
                    formatOptionLabel={formatOptionLabel}
                    isSearchable={false}
                    placeholder="Select Avatar"
                    onChange={(e) => setAvatar(e.value)}
                    styles={{ control: (provided, state) => ({ ...provided, boxShadow: state.isFocused ? "none" : null, borderColor: state.isFocused ? "gray" : provided.borderColor }) }}

                />
                {resetError && <span className="text-xs bold text-red-500">{resetError}</span>}
                {successMessage && <span className="text-xs bold text-green-500">{successMessage}</span>}

                <div className="p-2">
                    {resetError ?

                        <button
                            // onClick={handleReset}
                            blocked
                            className="flex flex-col w-[252px] h-[30.27px] items-center justify-center gap-[10px] px-[26px] py-[18px] relative bg-gray-300 rounded-[30px]"
                        >
                            <div className="relative w-[39px] h-[21px] mt-[-6.87px] mb-[-6.87px]">
                                <div className="absolute top-0 left-0 font-normal text-white text-[14px] tracking-[0] leading-[normal]">
                                    Submit
                                </div>
                            </div>
                        </button> :
                        <button
                            onClick={formSubmit}

                            className="flex flex-col w-[252px] h-[30.27px] items-center justify-center gap-[10px] px-[26px] py-[18px] relative bg-[#01b6ee] rounded-[30px]"
                        >
                            <div className="flex items-center justify-center relative w-[39px] h-[21px] mt-[-6.87px] mb-[-6.87px]">
                                <div className=" font-normal text-white text-[14px] tracking-[0] leading-[normal]">
                                    Submit
                                </div>
                            </div>
                        </button>
                    }
                    <div className="p-2 flex items-center justify-center">

                    <Link to="/login" className="text-xs underline text-gray-500">Back to login</Link>
                    </div>
                </div>

                <img src="/background.jpg" alt="Background" className="absolute -z-10 bg-cover" />
            </div>
        </div>
    );
}

export default VerifyToken;
