import './Card.css';

const Card = ({
    children,
    className = '',
    hover = false,
    padding = 'md',
    onClick,
    ...props
}) => {
    const classes = [
        'card',
        `card--padding-${padding}`,
        hover && 'card--hover',
        onClick && 'card--clickable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    );
};

export default Card;
