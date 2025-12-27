import { createContext, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';

const DuckContext = createContext();

const DuckProvider = ({ children }) => {
    const [duck, setDuck] = useState(null);

    const getRandomDuck = async () => {
        try {
            const response = await api.get('/ducks/random');
            console.log('Got duck:', response.data);
            setDuck(response.data);
        } catch (error) {
            console.error('Error fetching the random duck:', error);
            alert(`Failed to fetch duck: ${error.message}`);
        }
    };

    return (
        <DuckContext.Provider value={{ duck, getRandomDuck }}>
            {children}
        </DuckContext.Provider>
    );
};

DuckProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export { DuckContext, DuckProvider };
