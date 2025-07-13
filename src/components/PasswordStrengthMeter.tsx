import React from 'react';

export default function PasswordStrengthMeter({
  passwordScore,
}: {
  readonly passwordScore: number;
}): React.ReactElement {
  const widthPercentage = ((passwordScore + 1) * 100) / 5;

  const getLabel = () => {
    switch (passwordScore) {
      case 0:
        return 'Very weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Strong';
      case 4:
        return 'Very strong';
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    switch (passwordScore) {
      case 0:
        return '#FF0000';
      case 1:
        return '#FFAD00';
      case 2:
        return '#828282';
      case 3:
        return '#9bc158';
      case 4:
        return '#00b500';
      default:
        return '';
    }
  };

  const getPasswordColor = () => ({
    width: `${widthPercentage}%`,
    background: getProgressColor(),
    height: '5px',
  });

  return (
    <>
      <div className='progress m-0' style={{ height: '5px' }}>
        <div className='progress-bar' style={getPasswordColor()}></div>
      </div>
      <p className='text-right text-ml p-1 m-0' style={{ color: getProgressColor() }}>{getLabel()}</p>
    </>
  );
}
