import React, { useState } from 'react'
import axios from 'axios'
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

function Login() {
    const loginSchema = Yup.object().shape({
        user: Yup.string()
          .required('User ID is required'),
        password: Yup.string()
          .required('Password is required'),
      });
      
    const [user, setuser] = useState();
    const [password, setpassword] = useState();
    const navigate = useNavigate();
    const [loginError, setloginError] = useState("");

    const login = async () => {
        // console.log("t")
        // console.log(isLog)
        try {
            toast("Login", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: false,
            draggable: false,
            progress: undefined,
            theme: "light",
        })
            await loginSchema.validate({ user, password });
            const response = await axios.post(
                import.meta.env.VITE_REACT_APP_BASE_URL+"/login",
                { name: user, password: password }
            )
            // console.log(response.status)
            if (response.status == 200) {
                localStorage.setItem('id', response.data.user.id)
                localStorage.setItem('name', response.data.user.name)
                localStorage.setItem('pp', response.data.user.pp)
                localStorage.setItem('type', response.data.user.type)
                localStorage.setItem('auth', true)
                localStorage.setItem('jwt', response.data.jwt)
                navigate("/")
            }
        } catch(e) {
            // console.log(e);
            // console.log("incorect pass")
            setloginError("Invalid Credentials")
        }
        console.log(import.meta.env.VITE_REACT_APP_BASE_URL);
        
    };
    return (
        <div className='no-scrollbar'>
            
            
            <div class="flex flex-col h-screen justify-center items-center ">
                <div className="flex mt-10 mb-5">
                    <img src="logo.png" alt="" className='w-[300px] pl-1' />
                    {/* <div className="text-4xl font-bold"> partnerXchange</div> */}
                    

                </div>
                
                <div className="p-2">
                    <input type='text' placeholder='User ID' value={user} onChange={(e) => setuser(e.target.value)} className="flex flex-col w-[252px] h-[30.54px] items-start justify-center gap-[10px] px-[26px] py-[18px] relative bg-white rounded-[30px] border border-solid border-[#01b6ee4c] focus:outline-none active:border-[#01b6ee] focus:border-[#01b6ee]" />

                    {/* <img className="absolute w-[24px] h-[24px] top-0 left-0" alt="Codicon mail" src="codicon-mail.svg" /> */}

                </div>
                <div className="p-2">
                    <input type='password' placeholder='Password' value={password} onChange={(e) => setpassword(e.target.value)} className="flex flex-col w-[252px] h-[30.54px] items-start justify-center gap-[10px] px-[26px] py-[18px] relative bg-white rounded-[30px] border border-solid border-[#01b6ee4c] focus:outline-none active:border-[#01b6ee] focus:border-[#01b6ee]" />

                    {/* <img className="absolute w-[24px] h-[24px] top-0 left-0" alt="Codicon mail" src="codicon-mail.svg" /> */}

                </div>
                <span className='text-xs bold text-red-500'>
                {loginError}
                </span>
                <div className="p-2">
                    <button onClick={login} className="flex flex-col w-[252px] h-[30.27px] items-center justify-center gap-[10px] px-[26px] py-[18px] relative bg-[#01b6ee] rounded-[30px]">
                        <div className="relative w-[39px] h-[21px] mt-[-6.87px] mb-[-6.87px]">
                            <div className="absolute top-0 left-0 [font-family:'Poppins-Regular',Helvetica] font-normal text-white text-[14px] tracking-[0] leading-[normal]">
                                Login
                            </div>
                        </div>
                    </button>
                <div className="p-2 text-xs underline flex items-center justify-center text-gray-500">
                    <Link to="/reset-password">Forgot Password?</Link>
                </div>
                </div>
                <img src="background.jpg" alt="" className='absolute -z-10 bg-cover	'/>
            </div>
            
        </div>
    )
}

export default Login