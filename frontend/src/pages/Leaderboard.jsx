import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import LBsidebar from '../components/LBsidebar';
import LBitems from '../components/LBitems';
import { useUserContext } from '../context/UserProvider';
import { useProjectsContext } from '../context/ProjectsProvider';
import { useOBContext } from '../context/OBProvider';
import { toast } from 'react-toastify';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import axios from 'axios';
// import DateRangePicker from '../components/DateRangePicker';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
// import flatpickr from "flatpickr";
import dayjs from 'dayjs';
function Leaderboard() {
    const [timeDialogBox, settimeDialogBox] = useState("hidden");
    const token = localStorage.getItem('jwt');
    const { Users, setUsers } = useUserContext();
    const { OB, setOB } = useOBContext();
    const { Projects, setProjects } = useProjectsContext();

    function handleCancelTimeSwitch(params) {
        settimeDialogBox("hidden")
    }
    const [array, setArray] = useState(Users);

    useEffect(() => {
        let sortedArray = [...Users];
        sortedArray.sort((a, b) => {
            let aMilestone = a.milestone ? JSON.parse(a.milestone) : [];
            let bMilestone = b.milestone ? JSON.parse(b.milestone) : [];

            let aBeforeETATrueCount = aMilestone.filter(item => item.beforeETA === true).length;
            let bBeforeETATrueCount = bMilestone.filter(item => item.beforeETA === true).length;

            let aRatio = aMilestone.length > 0 ? aBeforeETATrueCount / aMilestone.length : 0;
            let bRatio = bMilestone.length > 0 ? bBeforeETATrueCount / bMilestone.length : 0;

            return bRatio - aRatio;
        });
        setArray(sortedArray);
    }, [Users]);

    const [Userid, setUserid] = useState();

    const [timeChangeData, settimeChangeData] = useState({});
    const [inHr, setinHr] = useState("00");
    const [inMM, setinMM] = useState("00");
    const [inM, setinM] = useState("AM");
    const [outHr, setoutHr] = useState("00");
    const [outMM, setoutMM] = useState("00");
    const [outM, setoutM] = useState("AM");
    const [timeZone, settimeZone] = useState("CST");
    const [ShiftStart, setShiftStart] = useState(dayjs());
    const [ShiftEnds, setShiftEnds] = useState(dayjs());
    const [UTCTime, setUTCTime] = useState("");
    async function book() {

        toast("Sync", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: false,
            draggable: false,
            progress: undefined,
            theme: "light"
        })
        let timeChange = true;
        let ShiftChange = true;
        // if (timeChangeData=="Out Of Office") {
        //     // timeChange=false
        // }
        if (Userid.dateRange != DateRangeData) {
            ShiftChange = false
        }
        else{
            ShiftChange = true
        }
        if (file) {
            console.log(file.name);
            submitFile().then(() => {


                const publicUrl = `/uploads/${file.name}`;
                fetch(import.meta.env.VITE_REACT_APP_BASE_URL + '/updateLB/' + Userid.id, {
                    method: 'PUT',
                    body: JSON.stringify({
                        ShiftHour: JSON.stringify(timeChangeData),
                        onboard_capacity: Userid.onboard_capacity,
                        projectCapacity: Userid.projectCapacity,
                        timeChange: timeChange,
                        user: Userid.user,
                        file: publicUrl,
                        ShiftChange: ShiftChange,
                        dateRange: DateRangeData
                    }),
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                        'Authorization': `Bearer ${token}`
                    },
                }).then(
                    () => window.location.reload(false)
                )
            }
            )
        }
        else {
            fetch(import.meta.env.VITE_REACT_APP_BASE_URL + '/updateLB/' + Userid.id, {
                method: 'PUT',
                body: JSON.stringify({
                    ShiftHour: JSON.stringify(timeChangeData),
                    onboard_capacity: Userid.onboard_capacity,
                    projectCapacity: Userid.projectCapacity,
                    timeChange: timeChange,
                    user: Userid.user,
                    ShiftChange: ShiftChange,
                    dateRange: DateRangeData,
                    // dateRangeOnCall:JSON.stringify(dateRangeOnCall)
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': `Bearer ${token}`
                },
            })
                .then((e) =>
                    window.location.reload(false)
                )
        }

    }
    useEffect(() => {
        settimeChangeData({
            ShiftStart: ShiftStart,
            ShiftEnds: ShiftEnds,
            timeZone: timeZone,
        })


    }, [ShiftEnds,ShiftStart, timeZone]);
    
    function handleSubmit() {

        book()
    }
    const [file, setFile] = useState(null);

    const submitFile = async (newFileName) => {
        // event.preventDefault();
        // settime(newFileName)
        const formData = new FormData();
        try {
            formData.append('file', file);
            console.log(file.name);
            await axios.post(import.meta.env.VITE_REACT_APP_BASE_URL + '/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } catch (error) {
            console.log(error);
        }

    }
    const handleFileUpload = (event) => {
        setFile(event.target.files[0]);
        setfiledata("File")
    }
    const [filedata, setfiledata] = useState("No file Selected");
    function setOPO() {
        setdateRangeType("Out Of Office")
        setactiveState({ background: "#FF7967", color: "#ffff" })
    }
    function setOnCall() {
        setdateRangeType("On Call")
        setactiveStateOnCall({ background: "#01b6ee", color: "#ffff" })
    }
    const [activeState, setactiveState] = useState({});
    const [activeStateOnCall, setactiveStateOnCall] = useState({});
    const [dateRange, setDateRange] = useState([new Date(), new Date()]);
    // const [dateRangeOnCall, setDateRangeOnCall] = useState([new Date(), new Date()]);
    const [dateRangeType, setdateRangeType] = useState("");
    const [DateRangeData, setDateRangeData] = useState();
    useEffect(() => {
        if (Userid && Userid.dateRange) {
            setDateRangeData(Userid.dateRange)
            // setDateRange(JSON.parse(Userid.dateRange).dateRange)
            // setdateRangeType(JSON.parse(Userid.dateRange).type)
        }
    }, [Userid]);
    useEffect(() => {
        setDateRangeData(JSON.stringify({ type: dateRangeType, dateRange: dateRange }))
    }, [dateRangeType, dateRange]);

    const handleDateChange = (selectedDates) => {
        setDateRange(selectedDates);
    };
    // const handleDateChangeOnCall = (selectedDates) => {
    //     setDateRangeOnCall(selectedDates);
    // };
    useEffect(() => {
        if (dateRangeType != "Out Of Office") {
            setactiveState({})
        }
        else if (dateRangeType != "On Call") {
            setactiveStateOnCall({})
            
        }
    }, [dateRangeType]);
    return (
        <>
            <div className={timeDialogBox}>
                <div className="fixed h-screen w-screen bg-black bg-opacity-20 backdrop-blur-sm z-10 transition-opacity	duration-700">
                    <div className="flex flex-col h-screen items-center justify-center">
                        <div className="bg-white  h-52 rounded-md p-6">
                            <div className="flex flex-col">
                                <div className="flex items-center">
                                    <div className="font-bold whitespace-nowrap">Shift Hours</div>
                                    <div className=" flex w-full justify-end items-center">

                                        <div className='whitespace-nowrap text-xs text-gray-400'>
                                            {filedata}
                                        </div>
                                        <div className="border-2 mx-2 border-[#01b6ee] rounded-md p-1">
                                            <input type="file" name="file-input" id="file-input" onChange={handleFileUpload} className="w-10 file:hidden opacity-0 absolute" />
                                            <label>

                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#01b6ee] ">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                                                </svg>
                                            </label>



                                        </div>
                                        <button onClick={setOPO} style={activeState} className=" border-2 mx-2 border-[#FF7967] text-[#FF7967] p-1 text-sm rounded-md w-28">Out Of Office
                                            {dateRangeType == "Out Of Office" ?

                                                <Flatpickr
                                                    className="w-full px-1 py-0 border border-gray-300 rounded-lg text-xs text-black"
                                                    options={{
                                                        mode: 'range',
                                                        dateFormat: 'm-d',

                                                    }}
                                                    value={dateRange}
                                                    onChange={handleDateChange}
                                                />
                                                : <>
                                                </>}
                                        </button>
                                        <button onClick={setOnCall} style={activeStateOnCall} className=" border-2 mx-2 border-[#01b6ee] text-[#01b6ee] p-1 text-sm rounded-md w-28">On Call
                                            {dateRangeType == "On Call" ?

                                                <Flatpickr
                                                    className="w-full px-1 py-0 border border-gray-300 rounded-lg text-xs text-black"
                                                    options={{
                                                        mode: 'range',
                                                        dateFormat: 'm-d',

                                                    }}
                                                    value={dateRange}
                                                    onChange={handleDateChange}
                                                />
                                                : <></>}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center h-20 ">

                                    {/* <div className="flex items-center">
                                        <input type='text' value={inHr} onChange={(e) => setinHr(e.target.value)} className="bg-transparent text-xl w-6 border-0 p-0" />
                                        <span className="text-xl">:</span>
                                        <input value={inMM} onChange={(e) => setinMM(e.target.value)} className="bg-transparent text-xl mr-4 w-6 border-0 p-0" />

                                        <select onChange={(e) => setinM(e.target.value)} name="ampm" className="bg-transparent text-xl appearance-none outline-none border-0 p-0  pr-9">
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                    </div>
                                    <div className="flex ml-5">
                                        <input value={outHr} onChange={(e) => setoutHr(e.target.value)} name="hours" className="bg-transparent text-xl w-6 border-0 p-0" />

                                        <span className="text-xl ">:</span>
                                        <input value={outMM} onChange={(e) => setoutMM(e.target.value)} name="minutes" className="bg-transparent text-xl w-8 mr-4 border-0 p-0" />
                                        <select onChange={(e) => setoutM(e.target.value)} name="ampm" className="bg-transparent text-xl appearance-none outline-none border-0 p-0 pr-9">
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                    </div> */}
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>

                                        <MobileDateTimePicker defaultValue={dayjs()}
                                            onChange={(e) => {
                                                var n = dayjs(e);
                                                setShiftStart(n)

                                            }} />
                                        <MobileDateTimePicker defaultValue={dayjs()}
                                            onChange={(e) => {
                                                var n = dayjs(e);
                                                setShiftEnds(n)

                                            }} />
                                    </LocalizationProvider>
                                    <button onClick={(e) => settimeZone("CST")} className="ml-4 mr-2 border-2 w-16 text-center rounded-md focus:border-[#01b6ee]"> CST</button>
                                    <button onClick={(e) => settimeZone("EST")} className="mx-1 border-2 w-16 text-center rounded-md focus:border-[#01b6ee]"> EST</button>
                                    <button onClick={(e) => settimeZone("IST")} className="mx-1 border-2 w-16 text-center rounded-md focus:border-[#01b6ee]"> IST</button>
                                </div>
                                <div className="flex justify-center items-center text-sm font-semibold">
                                    <button onClick={() => window.location.reload()} className="mx-4 border-2 h-8 w-24 flex items-center justify-center rounded-lg border-[#01b6ee] text-[#01b6ee]"> Cancel </button>
                                    <input type='submit' onClick={handleSubmit} className="mx-4 border-2 h-8 w-24 flex items-center justify-center rounded-lg border-[#01b6ee] bg-[#01b6ee] text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex flex-col h-screen p-16'>
                <Nav />
                <div className='flex mt-6'>
                    <div className=" basis-3/4">
                        <div className="table-fixed relative h-96 overflow-x-auto rounded pb-20">
                            <table className="w-full text-sm text-left rtl:text-right  ">


                                <thead className=" uppercase bg-[#01b6ee] text-white text-xs">
                                    <tr>
                                        <th className='sticky bg-[#01b6ee] top-0 px-4 '>

                                        </th>
                                        {/* <th scope="col" className="sticky bg-[#01b6ee] top-0 pr-0 py-3">
                                            <div className="flex items-center justify-center">

                                               No.
                                            </div>
                                        </th> */}
                                        <th scope="col" className="sticky bg-[#01b6ee] top-0 text-left py-3 px-7 whitespace-nowrap">
                                            Team Members
                                        </th>
                                        <th scope="col" className="sticky bg-[#01b6ee] top-0  py-3 text-left whitespace-nowrap">
                                            Onboarding Capacity
                                        </th>
                                        <th scope="col" className="sticky bg-[#01b6ee] top-0  py-3 text-left whitespace-nowrap">
                                            Project Capacity
                                        </th>
                                        {/* <th scope="col" className="sticky bg-[#01b6ee] top-0 px-7 py-3 text-left whitespace-nowrap">
                                            Shift Hours
                                        </th> */}
                                        <th scope="col" className="sticky bg-[#01b6ee] top-0 text-center whitespace-nowrap">
                                            Internal Notes
                                        </th>
                                        <th scope="col" className="sticky bg-[#01b6ee] top-0 px-2 py-3">

                                        </th>
                                    </tr>
                                </thead>
                                <tbody className=''>
                                    {array.map((item, index) => (
                                        <LBitems index={index} key={index} data={item} Projects={Projects} OB={OB} settimeDialogBox={settimeDialogBox} setUserid={setUserid} />
                                    ))}




                                </tbody>
                            </table>
                        </div>


                    </div>
                    <LBsidebar Users={Users} Projects={Projects} OB={OB} />

                </div>
            </div>
        </>
    )
}

export default Leaderboard