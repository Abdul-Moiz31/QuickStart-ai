import React,{useEffect} from 'react'
import { useSelector,useDispatch } from 'react-redux'
import { generateNewToken,loadUser,clearState } from '@/slices/userSlice'
import toast from 'react-hot-toast'

const Token = () => {
  const dispatch = useDispatch();
  const {isTokenGenerated,user,loading,error} = useSelector(state => state.user)
  useEffect (() => {
    dispatch(loadUser());
  },[dispatch])
  useEffect (() => {
    if (isTokenGenerated) {
      dispatch(clearState());
      dispatch(loadUser());
      toast.success('New Token Generated Successfully')
    }
    if (error) {
      toast.error(error)
      dispatch(clearState());
    }
  },[error,dispatch,isTokenGenerated])
  const handleGenerateNewToken = () => {
    // ask for confirmation from alert or modal
    if (window.confirm("Are you sure you want to Generate new token?")) {
      dispatch(generateNewToken(user))
    }
  }
    
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">API Token</h3>
            <p className="mb-4">
              Use this token to integrate our chat service into your website:
            </p>
            <input
             value={user?.chatbot_token || ''}
              readOnly
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white mb-4"
            />
            <p className="text-sm text-gray-400 mb-4">
              Keep this token secret. Do not share it publicly.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleGenerateNewToken} 
            >
              Reset Token
            </button>
          </div>
  )
}

export default Token