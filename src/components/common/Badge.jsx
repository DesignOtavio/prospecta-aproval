import { getStatusColor, getStatusLabel } from '../../utils/helpers';
import './Badge.css';

const Badge = ({ status, label, variant, mediaUrls, className = '' }) => {
    const badgeVariant = variant || getStatusColor(status, mediaUrls);
    const badgeLabel = label || getStatusLabel(status, mediaUrls);

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
