import React from 'react'

const Token = () => {
    
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">API Token</h3>
            <p className="mb-4">
              Use this token to integrate our chat service into your website:
            </p>
            <input
              value="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              readOnly
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white mb-4"
            />
            <p className="text-sm text-gray-400 mb-4">
              Keep this token secret. Do not share it publicly.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Generate New Token
            </button>
          </div>
  )
}

export default Token