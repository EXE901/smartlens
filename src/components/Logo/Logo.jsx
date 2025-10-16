import Tilt from 'react-parallax-tilt';
import './logo.css'
import a1logo from './a1logo.png';

const Logo = () => {
    return (
        <div className="ma4 mt0">
            <Tilt>
                <div className="Tilt-inner pa2">
                    <img src={a1logo} alt="a1logo" />
                </div>
            </Tilt>
        </div>
    );
}

export default Logo;
