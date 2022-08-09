#include<bits/stdc++.h>
using namespace std;

void srt(vector<int>& arr){
  int n=arr.size();
  for(int i=0;i<n-1;i++){
    for(int j=0;j<n-i-1;j++){
      if(arr[j]>arr[j+1]){
        swap(arr[j],arr[j+1]);
      }
    }
  }
}
void merge(vector<int> &arr,int low,int mid,int high){
  int i=low;
  int j=mid+1;
  int k=0;
  vector<int> ans;
  while(i<=mid&&j<=high){
    if(arr[i]<=arr[j]){
      ans.push_back(arr[i++]);
    }
    else{
      ans.push_back(arr[j++]);
    }
  }
  while(i<=mid){
    ans.push_back(arr[i++]);
  }
  while(j<=high){
    ans.push_back(arr[j++]);
  }

  for(int i=0;i<ans.size();i++){
      arr[i]=ans[i];
  }
}
void mergeSort(vector<int> &arr,int low,int high){
  if(low>=high){
    return;
  }
  int mid=(low+high)/2;
  mergeSort(arr,low,mid);
  mergeSort(arr,mid+1,high);
  merge(arr,low,mid,high);
}
int main(){
  int n=7;
  vector<int>arr(n)={5,4,6,2,8,7,9}
  srt(arr);
  for(int i=0;i<n;i++){
    cout<<arr[i]<<"";
  }
  return 0;
}
