"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useUserAvatar from '../hooks/useUserAvatar';
import { FaUserAlt } from 'react-icons/fa';

const formatCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return count.toString();
  }
};

const SubscriptionCard = ({ subscription }) => {
  const { avatarUrl } = useUserAvatar(subscription);
  
  return (
    <Link 
      href={`/profile?user=${subscription.username}`}
      className="flex flex-col items-center p-3 bg-[#151515] rounded-lg hover:bg-[#1a1a1a] transition-colors"
    >
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#272727] mb-3">
        {(subscription.avatar || avatarUrl) ? (
          <Image 
            src={subscription.avatar || avatarUrl} 
            alt={subscription.username}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <FaUserAlt size={24} className="text-[#444]" />
          </div>
        )}
      </div>
      
      <h3 className="text-white text-sm font-medium mb-1 text-center truncate w-full">
        {subscription.username}
      </h3>
      
      <span className="text-[#b1b1b1] text-xs">
        {formatCount(subscription.subscriberCount)} subscribers
      </span>
    </Link>
  );
};

const SubscriptionGrid = ({ subscriptions }) => {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-white/50">No subscriptions found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {subscriptions.map((subscription) => (
        <SubscriptionCard key={subscription.id} subscription={subscription} />
      ))}
    </div>
  );
};

export default SubscriptionGrid;