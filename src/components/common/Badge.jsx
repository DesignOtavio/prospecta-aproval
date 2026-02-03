import { getStatusColor, getStatusLabel } from '../../utils/helpers';
import './Badge.css';

const Badge = ({ status, label, variant, className = '' }) => {
    const badgeVariant = variant || getStatusColor(status);
    const badgeLabel = label || getStatusLabel(status);

    const classes = [
        'badge',
        `badge--${badgeVariant}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classes}>
            {badgeLabel}
        </span>
    );
};

export default Badge;
