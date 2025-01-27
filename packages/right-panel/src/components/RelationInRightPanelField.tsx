'use client';
import { RelationshipField, useField, useStepNav } from '@payloadcms/ui';
import { RelationshipFieldClientProps } from 'payload';
import { ArrowRightToBracket } from 'flowbite-react-icons/outline';
import { useRef } from 'react';
import { useCustomContext } from '../providers/CustomContext.js';

//throw event /context on click
const RelationInRightPanelField: React.FC<RelationshipFieldClientProps> = (props) => {
  const { isRightPanelOpen, setIsRightPanelOpen, setId, setCollection, setPrevStepNav } =
    useCustomContext();
  const { stepNav } = useStepNav();
  const { path } = props;
  const { value: entityId } = useField<string>({
    path: path,
  });
  const isFirstClick = useRef(true);

  const handleClick = () => {
    if (!isRightPanelOpen) {
      if (isFirstClick.current) {
        setPrevStepNav(stepNav);
        setIsRightPanelOpen(true);
        setCollection(props.field.relationTo as string);
        setId(entityId);
      } else {
        isFirstClick.current = false;
      }
    } else {
      setIsRightPanelOpen(false);
    }
  };

  return (
    <div className='relation-field-container'>
      <RelationshipField {...props} />
      {entityId && (
        <ArrowRightToBracket size={14} onClick={handleClick} className='relation-field-icon' />
      )}
    </div>
  );
};

export default RelationInRightPanelField;
