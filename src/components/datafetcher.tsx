import React, { useEffect, useState } from 'react';
import axios from 'axios';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/accounts/register/')
      .then(response => setData(response.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}

export default DataFetcher;
