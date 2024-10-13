import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import LBsidebar from '../components/LBsidebar'
import { useLocation } from 'react-router-dom';
import LBAitems from '../components/LBAitems';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

function LBarchive() {
  dayjs.extend(utc);
  dayjs.extend(timezone);

  let location = useLocation();
  const token = localStorage.getItem('jwt');

  // console.log(location);
  const [archive, setarchive] = useState([]);
  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {

    let url = import.meta.env.VITE_REACT_APP_BASE_URL + "/archive";

    let data = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include the JWT in the Authorization header
        'Authorization': `Bearer ${token}`
      }
    });
    let passedData = await data.json();

    setarchive(passedData.reverse());
  }
  return (
    <div className='flex flex-col h-screen p-16'>
      <Nav />
      <div className='flex mt-10'>

        <div className="table basis-3/4">
          <div class="relative overflow-x-auto rounded mx-20">
            <table class="w-full text-sm text-left rtl:text-right  ">
              <thead class="text-xs  uppercase bg-[#01b6ee] text-white font-light">
                <tr>
                  <th scope="col" class="px-6 py-3">
                    Date
                  </th>
                  <th scope="col" class="px-2 py-3">
                    Team Members
                  </th>
                  <th scope="col" class="px-2 py-3">
                    Shift Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  archive.map((item,index) => {
                    let str = item.ShiftHour;
                    let obj;
                    try {
                      obj = JSON.parse(item.ShiftHour);
                      const shiftStart = dayjs(obj.ShiftStart).tz(obj.timeZone);
                      const shiftEnd = dayjs(obj.ShiftEnds).tz(obj.timeZone);

                      // Get the current time in the specified time zone
                      const currentTime = dayjs().tz(obj.timeZone);

                      // Check if the current time is within the shift period
                      if (currentTime.isAfter(shiftStart) && currentTime.isBefore(shiftEnd)) {
                        // console.log('yes');
                      } else {

                        return <LBAitems data={item} />
                      }
                    } catch (error) {
                      // Skip parsing if ShiftHour is not a valid JSON object
                      return <LBAitems data={item} key={index}/>

                    }


                  })
                }
              </tbody>
            </table>
          </div>
        </div>
        {/* <LBsidebar /> */}
      </div>
    </div>
  )
}

export default LBarchive