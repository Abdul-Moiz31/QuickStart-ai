import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { generateNewToken, loadUser, clearState } from '@/slices/userSlice';
import toast from 'react-hot-toast';

const Token = () => {
  const dispatch = useDispatch();
  const { isTokenGenerated, user, loading, error } = useSelector(state => state.user);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (isTokenGenerated) {
      dispatch(clearState());
      dispatch(loadUser());
      toast.success('New Token Generated Successfully');
    }
    if (error) {
      toast.error(error);
      dispatch(clearState());
    }
  }, [error, dispatch, isTokenGenerated]);

  const handleGenerateNewToken = () => {
    if (window.confirm("Are you sure you want to Generate new token?")) {
      dispatch(generateNewToken(user));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-black-500">API Token</h3>
      <p className="mb-4 text-gray-700">
        Use this token to integrate our chat service into your website:
      </p>
      <input
        value={user?.chatbot_token || ''}
        readOnly
        className="w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 mb-4"
      />
      <p className="text-sm text-gray-500 mb-4">
        Keep this token secret. Do not share it publicly.
      </p>
      <button
        className="bg-[#9e45f1] hover:bg-[#6c2794] text-white px-4 py-2 rounded "
        onClick={handleGenerateNewToken}
      >
        Reset Token
      </button>
    </div>
  );
};

export default Token;
